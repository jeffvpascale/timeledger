using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Entities
{
	public class ApplicationUser : IdentityUser
	{
		[Required]
		[MaxLength(50)]
		public string FirstName { get; set; } = String.Empty;

		[Required]
		[MaxLength(50)]
		public string LastName { get; set; } = String.Empty;

		[MaxLength(100)]
		public string? Company { get; set; }
	}
}
