using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ClientUpdateDto
	{
		[Required]
		public required string Name { get; set; } = string.Empty;

		public bool IsArchived { get; set; }

	}
}
