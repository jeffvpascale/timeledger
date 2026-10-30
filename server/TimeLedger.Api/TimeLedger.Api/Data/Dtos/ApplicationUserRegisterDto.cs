using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ApplicationUserRegisterDto
	{
		[Required]
		[MaxLength(50)]
		public string FirstName { get; set; } = String.Empty;

		[Required]
		[MaxLength(50)]
		public string LastName { get; set; } = String.Empty;

		[MaxLength(100)]
		public string? Company { get; set; }

		[Required]
		[EmailAddress]
		[MaxLength(254)]
		public string Email { get; set; } = String.Empty;

		[Required]
		[MinLength(8)]
		[MaxLength(128)]
		public string Password { get; set; } = String.Empty;
	}
}
